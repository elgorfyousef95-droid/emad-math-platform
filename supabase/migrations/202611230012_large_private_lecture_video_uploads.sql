-- Keep lecture media private while allowing large resumable uploads.
update storage.buckets
set file_size_limit = 1073741824,
    allowed_mime_types = array['video/mp4','video/webm','video/quicktime']
where id = 'emad-lecture-videos';
